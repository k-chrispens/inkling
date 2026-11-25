import { useImperativeHandle, useState } from "react";
import type { RefObject } from "react";

import { CloseIcon } from "@earendil-works/elanor-icons-react";
import {
  Checkbox,
  IconButton,
  Popover,
  SelectionControlAndLabel,
  Stack,
} from "@earendil-works/elanor-react";

import type { ProjectedCommentThread } from "../comments.ts";
import { formatLocalDate } from "../ui.ts";
import styles from "./comments.module.css";

export interface CommentControlsHandle {
  readonly close: () => void;
  readonly open: () => void;
}

export interface CommentControlsProps {
  readonly anchorRef: RefObject<HTMLElement | null>;
  readonly onOpenThread: (threadId: string) => void;
  readonly onShowResolvedChange: (show: boolean) => void;
  readonly ref?: React.Ref<CommentControlsHandle> | undefined;
  readonly resolvedCount: number;
  readonly showResolved: boolean;
  /** The threads to list, in reading order. */
  readonly threads: readonly ProjectedCommentThread[];
}

export function CommentControls({
  anchorRef,
  onOpenThread,
  onShowResolvedChange,
  ref,
  resolvedCount,
  showResolved,
  threads,
}: CommentControlsProps): React.JSX.Element {
  const [open, setOpen] = useState(false);

  useImperativeHandle(
    ref,
    () => ({
      close: () => setOpen(false),
      open: () => setOpen(true),
    }),
    [],
  );

  return (
    <Popover.Root onOpenChange={setOpen} open={open}>
      <Popover.Portal>
        <Popover.Positioner align="end" anchor={anchorRef} collisionPadding={16} sideOffset={8}>
          <Popover.Popup
            aria-label="Comments"
            className={styles["menu"]}
            data-comment-controls=""
            id="comment-menu"
          >
            <Stack align="start" direction="row" gap="auto">
              <Stack gap="xxSmall">
                <Popover.Title>Comments</Popover.Title>
                <Popover.Description>
                  Select Markdown or rendered text to comment on it.
                </Popover.Description>
              </Stack>
              <IconButton aria-label="Close comments" onClick={() => setOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Stack>
            <SelectionControlAndLabel
              control={
                <Checkbox.Root
                  checked={showResolved}
                  data-show-resolved=""
                  onCheckedChange={onShowResolvedChange}
                >
                  <Checkbox.Indicator />
                </Checkbox.Root>
              }
            >
              Show resolved threads ({resolvedCount})
            </SelectionControlAndLabel>
            {threads.length === 0 ? (
              <p className={styles["noThreads"]}>
                {resolvedCount === 0 ? "No comments yet." : "No open comments."}
              </p>
            ) : (
              <ol className={styles["threadList"]} data-comment-list="">
                {threads.map(({ orphaned, thread }) => (
                  <li key={thread.id}>
                    <button
                      className={`${styles["listedThread"]}${thread.resolved ? ` ${styles["resolved"]}` : ""}`}
                      data-comment-listed={thread.id}
                      onClick={orphaned ? undefined : () => onOpenThread(thread.id)}
                      type="button"
                      // A thread whose text is gone has no place in the document, so its
                      // card opens against this entry.
                      {...(orphaned
                        ? { "data-comment-bubble": thread.id, "data-comment-surface": "preview" }
                        : {})}
                    >
                      {orphaned || thread.resolved ? (
                        <span className={styles["listedStatus"]}>
                          {[
                            thread.resolved ? "Resolved" : undefined,
                            orphaned ? "Original text removed" : undefined,
                          ]
                            .filter((status) => status !== undefined)
                            .join(" · ")}
                        </span>
                      ) : null}
                      {thread.anchor.quote === "" ? null : (
                        <span className={styles["listedQuote"]}>{thread.anchor.quote}</span>
                      )}
                      {thread.messages.map((message) => (
                        <span className={styles["listedMessage"]} key={message.id}>
                          <span className={styles["byline"]}>
                            <b>{message.authorDisplayName}</b>
                            <time dateTime={message.createdAt}>
                              {formatLocalDate(message.createdAt)}
                            </time>
                          </span>
                          <span>{message.body}</span>
                        </span>
                      ))}
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
